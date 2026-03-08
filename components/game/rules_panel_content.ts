export type RulesSection = {
  title: string;
  body: string;
};

export const RULES_SECTIONS: RulesSection[] = [
  {
    title: "Goal",
    body:
      "Survive the entire dungeon deck with as much health as possible. Your starting health is 20.",
  },
  {
    title: "Card Types",
    body:
      "Clubs & Spades are Monsters (damage = card value; J=11, Q=12, K=13, A=14). Diamonds are Weapons (equipping replaces your current weapon). Hearts are Health Potions (restore HP up to 20; only one potion per turn).",
  },
  {
    title: "Turn Flow",
    body:
      "Draw cards until 4 are face-up in the Room. You may avoid the Room (all 4 cards go to the bottom of the dungeon), but not two turns in a row. Otherwise, choose and resolve 3 of the 4 cards one at a time. The remaining card stays for the next Room.",
  },
  {
    title: "Combat",
    body:
      "Fight barehanded: subtract the monster\u2019s full value from your health. Fight with weapon: subtract (monster value \u2212 weapon value) from health (minimum 0 damage). After using a weapon on a monster, it can only be used on monsters of equal or lower value than the last monster it slew.",
  },
  {
    title: "Scoring",
    body:
      "If your health reaches 0, subtract all remaining dungeon monster values \u2014 that negative number is your score. If you cleared the dungeon, your score is your remaining health (bonus: if the last card was a potion, add its value).",
  },
];
