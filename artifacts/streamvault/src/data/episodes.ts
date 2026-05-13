export interface Episode {
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  duration: string;
  description: string;
}

const EPISODE_DATA: Record<string, { seasons: { titles: string[]; duration: string }[] }> = {
  t1: {
    seasons: [
      { duration: "47m", titles: ["The Vanishing of Will Byers", "The Weirdo on Maple Street", "Holly, Jolly", "The Body", "The Flea and the Acrobat", "The Monster", "The Bathtub", "The Upside Down"] },
      { duration: "55m", titles: ["MADMAX", "Trick or Treat, Freak", "The Pollywog", "Will the Wise", "Dig Dug", "The Spy", "The Lost Sister", "The Mind Flayer", "The Gate"] },
      { duration: "51m", titles: ["Suzie, Do You Copy?", "The Mall Rats", "The Case of the Missing Lifeguard", "The Sauna Test", "The Flayed", "E Pluribus Unum", "The Bite", "The Battle of Starcourt"] },
      { duration: "63m", titles: ["The Hellfire Club", "Vecna's Curse", "The Monster and the Superhero", "Dear Billy", "The Nina Project", "The Dive", "The Massacre at Hawkins Lab", "Papa", "The Piggyback"] },
    ],
  },
  t2: {
    seasons: [
      { duration: "62m", titles: ["When You're Lost in the Darkness", "Infected", "Please Hold to My Hand", "Please Hold to My Hand", "Endure and Survive", "Kin", "Left Behind", "When We Are in Need", "Look for the Light"] },
      { duration: "58m", titles: ["Future Days", "Through the Valley", "Path of the Righteous", "The Last of Us Day", "Transmission", "Cause and Effect", "The Price We Pay"] },
    ],
  },
  t3: {
    seasons: [
      { duration: "57m", titles: ["The Heirs of the Dragon", "The Rogue Prince", "Second of His Name", "King of the Narrow Sea", "We Light the Way", "The Princess and the Queen", "Driftmark", "The Lord of the Tides", "The Green Council", "The Black Queen"] },
      { duration: "68m", titles: ["A Son for a Son", "Rhaenyra the Cruel", "The Burning Mill", "The Red Dragon and the Gold", "Regent", "Smallfolk", "The Red Sowing", "The Lifetime of the Day"] },
    ],
  },
  t4: {
    seasons: [
      { duration: "32m", titles: ["Red Light, Green Light", "Hell", "The Man with the Umbrella", "Stick to the Team", "A Fair World", "Gganbu", "VIPS", "Front Man", "One Lucky Day"] },
      { duration: "35m", titles: ["What Is Going On?", "Bread and Circus", "001", "Tbornado", "One More Game", "Winner Take All", "Finale"] },
    ],
  },
  t5: {
    seasons: [
      { duration: "58m", titles: ["Wolferton Splash", "Hyde Park Corner", "Windsor", "Act of God", "Smoke and Mirrors", "Gelignite", "Scientia Potentia Est", "Pride & Joy", "Assassins", "Gloriana"] },
      { duration: "56m", titles: ["Misadventure", "A Company of Men", "Lisbon", "Beryl", "Marionettes", "Vergangenheit", "Matrimonium", "Dear Mrs. Kennedy", "Paterfamilias", "Mystery Man"] },
      { duration: "60m", titles: ["Olding", "Margaretology", "Aberfan", "Bubbikins", "Coup", "Tywysog Cymru", "Terra Nullius", "Dangling Man", "Imbroglio", "War"] },
      { duration: "55m", titles: ["Gold Stick", "The Hereditary Principle", "Fairytale", "Favourites", "Fagan", "Terra Nullius", "The Hereditary Principle", "48:1", "Avalanche", "War"] },
      { duration: "53m", titles: ["Queen Victoria Syndrome", "The System", "Mou Mou", "Annus Horribilis", "The Way Ahead", "Ipatiev House", "No Woman's Land", "Gunpowder"] },
      { duration: "51m", titles: ["Attempt at Clarity", "Two Photographs", "The Singular Affair of Jack Barrowman", "Ritz", "Willsmania", "Ruritania"] },
    ],
  },
};

const DEFAULT_TITLES = [
  "Pilot", "The Beginning", "Rising Action", "The Turn", "Revelation", "The Stakes", "Into the Dark", "Breaking Point", "The Reckoning", "Finale",
];

function getTitle(seriesId: string, season: number, ep: number): string {
  const data = EPISODE_DATA[seriesId];
  if (data && data.seasons[season - 1] && data.seasons[season - 1].titles[ep - 1]) {
    return data.seasons[season - 1].titles[ep - 1];
  }
  return DEFAULT_TITLES[(ep - 1) % DEFAULT_TITLES.length] || `Episode ${ep}`;
}

function getDuration(seriesId: string, season: number): string {
  const data = EPISODE_DATA[seriesId];
  if (data && data.seasons[season - 1]) return data.seasons[season - 1].duration;
  const durations = ["43m", "47m", "52m", "55m", "38m", "45m"];
  return durations[(season + Number(seriesId.replace("t", ""))) % durations.length];
}

function getEpisodeCount(seriesId: string, season: number, totalSeasons: number): number {
  const data = EPISODE_DATA[seriesId];
  if (data && data.seasons[season - 1]) return data.seasons[season - 1].titles.length;
  return season === totalSeasons ? 6 : 8;
}

export function getEpisodes(seriesId: string, totalSeasons: number): Episode[] {
  const episodes: Episode[] = [];
  for (let s = 1; s <= totalSeasons; s++) {
    const count = getEpisodeCount(seriesId, s, totalSeasons);
    for (let e = 1; e <= count; e++) {
      episodes.push({
        seasonNumber: s,
        episodeNumber: e,
        title: getTitle(seriesId, s, e),
        duration: getDuration(seriesId, s),
        description: `Season ${s}, Episode ${e}`,
      });
    }
  }
  return episodes;
}
