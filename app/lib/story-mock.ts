import TalesOfLilyAndLeo from "../images/Tales_of_Lily_and_Leo.svg";

interface Story {
  id: string;
  title: string;
  episodes: string;
  imgSrc?: string;
  description: string;
}

const stories: Story[] = [
  {
    id: "1",
    title: "Tales of Lily and Leo",
    episodes: "3+15 episodes",
    imgSrc: TalesOfLilyAndLeo,
    description:
      "Dive into the magical world of 'The Enchanted Forest', where every tree tells a story and every creature has a tale...",
  },
  {
    id: "2",
    title: "The Enchanted Forest",
    episodes: "3+15 episodes",
    description:
      "Dive into the magical world of 'The Enchanted Forest', where every tree tells a story and every creature has a tale...",
  },
  {
    id: "3",
    title: "The Enchanted Forest",
    episodes: "3+15 episodes",
    description:
      "Dive into the magical world of 'The Enchanted Forest', where every tree tells a story and every creature has a tale...",
  },
  {
    id: "4",
    title: "The Enchanted Forest",
    episodes: "3+15 episodes",
    description:
      "Dive into the magical world of 'The Enchanted Forest', where every tree tells a story and every creature has a tale...",
  },
  {
    id: "5",
    title: "The Enchanted Forest",
    episodes: "3+15 episodes",
    description:
      "Dive into the magical world of 'The Enchanted Forest', where every tree tells a story and every creature has a tale...",
  },
  // Add more stories as needed
];
