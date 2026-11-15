/*
  Sheepy and the Little Lost Star: the story itself.

  How it works:
  - Every page has a name (like "start" or "betty-1"). The story begins at "start".
  - "next" says which page comes after it.
  - A choice page has "choices" instead of "next". Each choice has a button label
    and the page it goes "to".
  - The last page of each path has "ending" instead of "next". It names one of the
    ENDINGS at the bottom of this file.
  - "picture" describes the illustration for that page. Save each picture as
    images/<page name>.jpg (for example images/betty-1.jpg) and it shows up
    automatically. Until then, the reader shows the description instead.
    The cover is images/cover.jpg.
  - Starting a new line inside the text starts a new line on the page.
*/

var STORY = {

  "start": {
    picture: "Night in the meadow. Sheepy lies awake, snuggled in Blankie, looking up at a sky full of stars. One tiny star is falling.",
    text: `It was bedtime in the meadow, but Sheepy could not sleep. He tried counting people, because that's what sheep count, but he only got to seven. So he snuggled up in Blankie and gazed at the twinkling sky. Suddenly, one tiny light wobbled, tumbled, and fell. Plink! It landed in the grass nearby.`,
    next: "star"
  },

  "star": {
    picture: "Sheepy and Blankie peer down at a tiny glowing star, no bigger than a button, sitting sadly in the clover.",
    text: `Sheepy and Blankie tiptoed over. There in the clover sat a little star, no bigger than a button. Its glow flickered like a sleepy candle. "I slipped off my cloud," it whispered, "and now I can't get home. If I'm not back before the sun wakes up, there will be a gap in the sky."`,
    next: "ask"
  },

  "ask": {
    picture: "Sheepy holds the little star gently in his hooves. Blankie's unicorn horn points down a path that splits in two: one way to a big tree glowing in the moonlight, the other to a pond with lily pads and singing frogs.",
    text: `"Don't worry, little star," said Sheepy. "We'll help you get home. But the sky is ever so high, so we'll need a friend." Down one path was the Moonlight Tree. Down the other was Lily Pad Pond, where the frogs sing every night. Who should they ask for help?`,
    choices: [
      { label: "🌙 Ask Betty at the Moonlight Tree", to: "betty-1" },
      { label: "🐸 Ask Barnacles at Lily Pad Pond", to: "barnacles-1" }
    ]
  },

  /* ---- Betty's path ---- */

  "betty-1": {
    picture: "Betty hangs upside down from a branch of the Moonlight Tree, reading a book about stars by lantern light. Sheepy and Blankie hold up the little star.",
    text: `In the Moonlight Tree, Betty was hanging upside down from a branch, reading by lantern light. "A real star!" Betty gasped, nearly dropping the book. It was a book all about the night sky. Betty flipped through the pages, then tapped one. "Look! Your home is right next to the moon."`,
    next: "betty-2"
  },

  "betty-2": {
    picture: "Betty carries the lantern through dark woods full of fireflies. Beside the path, Barnacles, in a green frog hat, peeks out of the reeds of a lily pad pond among the singing frogs.",
    text: `Betty climbed down with the lantern, and off they went through the Whispering Woods. Fireflies blinked to show the way. At Lily Pad Pond, the frogs were singing their goodnight song, and one "RIBBIT!" was much deeper than the rest. It was Barnacles, in a green frog hat! "A night-time adventure? Wait for me!" Soon, four friends were climbing the Tallest Hill.`,
    next: "hill"
  },

  /* ---- Barnacles' path ---- */

  "barnacles-1": {
    picture: "Barnacles sits among the reeds of a lily pad pond wearing a green frog hat, waving a reed like a conductor while a choir of frogs sings on the lily pads. The little star glows a bit brighter in Sheepy's hooves as Sheepy and Blankie listen from the bank.",
    text: `At Lily Pad Pond, the frogs were singing their goodnight song. Barnacles sat in the middle, wearing a green frog hat and waving a reed in time to the music. The frogs weren't sure why a capybara was pretending to be a frog, but they played along. They sang the little star a croaky lullaby, and it glowed a little brighter. "The Tallest Hill is the closest place to the sky," said Barnacles. "Hop on!"`,
    next: "barnacles-2"
  },

  "barnacles-2": {
    picture: "Barnacles paddles across the moonlit lily pad pond with Sheepy and Blankie riding on Barnacles' back, while frogs wave goodbye to their strange new friend from their lily pads. On the far shore, Betty waves a lantern.",
    text: `Sheepy and Blankie climbed onto Barnacles' back, and Barnacles paddled them across the pond like a cosy, furry boat. Splish, splash, splish. The frogs waved goodbye from their lily pads. On the other side, a lantern came bobbing towards them. It was Betty! "I saw a star fall, so I came to help." Soon, four friends were climbing the Tallest Hill.`,
    next: "hill"
  },

  /* ---- Both paths meet again here ---- */

  "hill": {
    picture: "All four friends on top of the Tallest Hill under a huge starry sky. Sheepy holds the little star up towards a dark gap beside the moon.",
    text: `At the very top, the sky felt close enough to touch, but it wasn't. The little star looked up at the gap beside the moon and gave a tired sigh. "It's still so far." The four friends looked at each other. They had to think of something. How should they help the little star get home?`,
    choices: [
      { label: "🦄 Fly up on Blankie", to: "fly-1" },
      { label: "🎵 Sing it a lullaby", to: "sing-1" },
      { label: "💙 Bounce on squishy Betty", to: "bounce-1" }
    ]
  },

  /* ---- Ending: The Magic Ride ---- */

  "fly-1": {
    picture: "Blankie flies like a magic carpet up through marshmallow clouds, with Sheepy riding on top holding the giggling star. Betty and Barnacles wave from the hilltop far below.",
    text: `Blankie fluffed up, flapped twice, and floated into the air like a magic carpet. Sheepy climbed aboard, holding the star safely in his hooves. Betty and Barnacles waved from the hilltop as they rose up, up, up, past the sleepy birds and through the marshmallow clouds. "Wheee!" giggled the little star. "We're nearly there!"`,
    next: "fly-2"
  },

  "fly-2": {
    picture: "High in the sky beside the moon, Sheepy places the little star back in its spot. It shines brightly and leaves a tiny glowing moon on Sheepy's front leg.",
    text: `Gently, Sheepy put the little star back in its place beside the moon. It shone so brightly that the whole sky seemed to smile. "Thank you," it twinkled, and it left a tiny glowing moon on Sheepy's front leg. Blankie floated softly down, but Sheepy was fast asleep before they landed. Look closely, and you can still see that little moon today.`,
    ending: "fly"
  },

  /* ---- Ending: The Starlight Song ---- */

  "sing-1": {
    picture: "The four friends sit in a circle on the hilltop, singing softly with their eyes closed. The little star in the middle glows brighter and brighter.",
    text: `"Stars love lullabies," said Betty. So the friends sat in a circle and sang as softly as they could:
Little star, so small and bright,
Float back home and say goodnight.
With every word, the star glowed brighter and brighter, until it shone like a lantern.`,
    next: "sing-2"
  },

  "sing-2": {
    picture: "The little star floats up into the sky like a dandelion seed. Below, the four friends are fast asleep in a cosy heap on the hilltop.",
    text: `Slowly, the little star lifted out of Sheepy's hooves and floated away like a dandelion seed, all the way home to its place beside the moon. It twinkled twice to say thank you. The friends kept humming the song, softer and softer, until they were all fast asleep in a cosy heap on the hilltop.`,
    ending: "sing"
  },

  /* ---- Ending: The Big Bounce ---- */

  "bounce-1": {
    picture: "Betty lies flat on the grass like a trampoline. The little star bounces high above, while Sheepy, Blankie and Barnacles count and cheer.",
    text: `"I'm the squishiest friend in the whole meadow," said Betty. "Let's bounce!" Betty lay down flat, and the little star hopped on top. Boing! It bounced as high as the trees. Boing! It bounced as high as the clouds. Everyone counted together. "One... two... three..." BOING!`,
    next: "bounce-2"
  },

  "bounce-2": {
    picture: "The little star zooms home to the moon, leaving a trail of sparkles that drifts down like glittery snow onto the giggling friends.",
    text: `Up zoomed the little star, all the way home to its place beside the moon. As it went, it left a trail of sparkles that drifted down like glittery snow. The friends caught them on their noses and giggled. Then they took turns bouncing on Betty until they were far too sleepy to bounce any more.`,
    ending: "bounce"
  }

};

/* The endings, in the order they're shown on "The End" screen. */
var ENDINGS = {
  "fly":    { title: "The Magic Ride",     message: "Goodnight from Sheepy, and the little moon on his leg." },
  "sing":   { title: "The Starlight Song", message: "Next time you sing to the stars, look for one that twinkles twice." },
  "bounce": { title: "The Big Bounce",     message: "Sweet dreams, and happy bouncing!" }
};
