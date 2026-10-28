"""Sets up a Godot Web export in games/<name>/ the Sheepy Games way.

    python -I tools/godot_game.py <name> [<name> ...]

Run it after every export is copied into games/<name>/ (deploy_site.py does), or on a game
that is already set up to rewrite its page. For each game it:

- moves the engine (index.wasm, index.js and the two audio worklets) into
  engine/<godot version>-<hash>/, shared by every game built with the same engine, so a
  player downloads the 10 MB engine once for all of them instead of once per game;
- writes games/<name>/index.html from tools/godot_game.html: the Sheepy loading screen with
  the game's banner (assets/images/<name>-banner.*), a progress bar and a friendly page if the
  game can't start.

An engine folder never changes once it's made (its name carries the hash of its files), so
browsers can keep engine/* for a year (a Cloudflare cache rule does that). Nothing here
deletes an engine folder: a game left on an older Godot keeps using its own.
"""
import hashlib
import html
import json
import re
import shutil
import struct
import sys
from pathlib import Path

SITE = Path(__file__).resolve().parent.parent
TEMPLATE = SITE / "tools" / "godot_game.html"
# What Godot exports -> what it's called in the shared engine folder.
ENGINE_FILES = {
    "index.wasm": "godot.wasm",
    "index.js": "godot.js",
    "index.audio.worklet.js": "godot.audio.worklet.js",
    "index.audio.position.worklet.js": "godot.audio.position.worklet.js",
}
BANNER_TYPES = (".jpg", ".png", ".webp")


def godot_version(pck: Path) -> str:
    head = pck.read_bytes()[:24]
    if head[:4] != b"GDPC":
        sys.exit(f"{pck} isn't a Godot pack")
    major, minor, patch = struct.unpack_from("<3I", head, 8)
    return f"{major}.{minor}.{patch}"


def engine_hash(game: Path) -> str:
    digest = hashlib.sha256()
    for name in ENGINE_FILES:
        digest.update(name.encode())
        digest.update((game / name).read_bytes())
    return digest.hexdigest()[:8]


def share_engine(game: Path) -> str:
    """Moves a fresh export's engine into engine/ and returns its path for the page."""
    missing = [name for name in ENGINE_FILES if not (game / name).exists()]
    if missing:
        sys.exit(f"{game} has index.wasm but not {', '.join(missing)}: is it a whole Web export?")
    folder = SITE / "engine" / f"{godot_version(game / 'index.pck')}-{engine_hash(game)}"
    if folder.exists():
        for src, dst in ENGINE_FILES.items():
            if (folder / dst).read_bytes() != (game / src).read_bytes():
                sys.exit(f"{folder / dst} differs from {game / src}, but the hash matched. Stopping.")
    else:
        folder.mkdir(parents=True)
        for src, dst in ENGINE_FILES.items():
            shutil.copy2(game / src, folder / dst)
        print(f"  new shared engine: {folder.relative_to(SITE).as_posix()}/")
    for src in ENGINE_FILES:
        (game / src).unlink()
    return f"/engine/{folder.name}/godot"


def set_up(name: str) -> None:
    game = SITE / "games" / name
    page_path = game / "index.html"
    if not (game / "index.pck").exists() or not page_path.exists():
        sys.exit(f"{game} has no index.pck and index.html: export the game into it first")
    page = page_path.read_text(encoding="utf-8")

    # Read what Godot wrote: its config, the game's name and the icons in the head.
    found = re.search(r"const GODOT_CONFIG = (\{.*?\});\n", page)
    if not found:
        sys.exit(f"{page_path} has no GODOT_CONFIG: is it a Godot export?")
    config = json.loads(found.group(1))
    if "const GODOT_THREADS_ENABLED = true" in page:
        sys.exit(f"{name} uses the threaded engine; the site's games use the single-threaded one")
    title = html.unescape(re.search(r"<title>(.*?)</title>", page, re.S).group(1).strip())
    head = (re.search(r"<!-- head include -->\n(.*?)\n<!-- /head include -->", page, re.S)
            or re.search(r"</style>\s*(.*?)\s*</head>", page, re.S))
    head_include = head.group(1).strip()

    if (game / "index.wasm").exists():
        executable = share_engine(game)
    else:
        executable = config.get("executable", "")
        if not executable.startswith("/engine/"):
            sys.exit(f"{game} has no index.wasm and its page doesn't name a shared engine")
    engine = SITE / executable.strip("/").rsplit("/", 1)[0]
    for file in ENGINE_FILES.values():
        if not (engine / file).exists():
            sys.exit(f"{name} needs {engine / file}, which is missing")
    # Godot's own splash picture; the page shows the game's banner instead.
    (game / "index.png").unlink(missing_ok=True)

    config["executable"] = executable
    config["mainPack"] = "index.pck"
    config["fileSizes"] = {
        f"{executable}.wasm": (engine / "godot.wasm").stat().st_size,
        "index.pck": (game / "index.pck").stat().st_size,
    }

    banner = next((SITE / "assets" / "images" / f"{name}-banner{ext}" for ext in BANNER_TYPES
                   if (SITE / "assets" / "images" / f"{name}-banner{ext}").exists()), None)
    if banner:
        src = "/" + banner.relative_to(SITE).as_posix()
        preload = f'<link rel="preload" as="image" href="{src}" fetchpriority="high">'
        image = f'<div class="card"><img src="{src}" alt="" fetchpriority="high"></div>'
        status_class = ""
    else:
        print(f"  note: no assets/images/{name}-banner.* yet, so the page shows Sheepy without a poster")
        preload = image = ""
        status_class = "no-banner"

    out = TEMPLATE.read_text(encoding="utf-8")
    for key, value in {
        "%%TITLE%%": html.escape(title),
        "%%HEAD_INCLUDE%%": head_include,
        "%%BANNER_PRELOAD%%": preload,
        "%%BANNER_IMG%%": image,
        "%%STATUS_CLASS%%": status_class,
        "%%ENGINE_JS%%": f"{executable}.js",
        "%%CONFIG%%": json.dumps(config, separators=(",", ":")),
    }.items():
        out = out.replace(key, value)
    page_path.write_text(out, encoding="utf-8", newline="\n")
    pck = (game / "index.pck").stat().st_size / 1e6
    print(f"{name}: {title}, engine {engine.name}, index.pck {pck:.2f} MB")


def main() -> None:
    names = sys.argv[1:]
    if not names or names[0].startswith("-"):
        sys.exit(__doc__)
    for name in names:
        set_up(name)
    used = {re.search(r'"executable":"/engine/([^/]+)/', (page.read_text(encoding="utf-8")))
            for page in (SITE / "games").glob("*/index.html")}
    used = {match.group(1) for match in used if match}
    for folder in sorted((SITE / "engine").glob("*/")):
        if folder.name not in used:
            print(f"note: no game uses engine/{folder.name}/ any more (it can go, once nothing links to it)")


if __name__ == "__main__":
    main()
