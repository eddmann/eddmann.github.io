export interface Profile {
  network: string;
  username?: string;
  url?: string;
}

export interface Location {
  address?: string;
  postalCode?: string;
  city?: string;
  region?: string;
  countryCode?: string;
}

export interface Basics {
  name: string;
  label?: string;
  image?: string;
  email?: string;
  phone?: string;
  url?: string;
  website?: string;
  summary?: string;
  location?: Location;
  profiles?: Profile[];
}

export interface Work {
  name?: string;
  company?: string;
  position?: string;
  url?: string;
  startDate?: string;
  endDate?: string;
  summary?: string;
  highlights?: string[];
}

export interface Volunteer {
  organization?: string;
  position?: string;
  url?: string;
  startDate?: string;
  endDate?: string;
  summary?: string;
  highlights?: string[];
}

export interface Education {
  institution: string;
  url?: string;
  area?: string;
  studyType?: string;
  startDate?: string;
  endDate?: string;
  score?: string;
  courses?: string[];
}

export interface Award {
  title?: string;
  date?: string;
  awarder?: string;
  summary?: string;
}

export interface Skill {
  name: string;
  level?: string;
  keywords?: string[];
}

export interface Project {
  name: string;
  url?: string;
  description?: string;
  highlights?: string[];
}

export interface Interest {
  name: string;
  keywords?: string[];
}

export interface Language {
  language: string;
  fluency?: string;
}

export interface Reference {
  name?: string;
  reference?: string;
}

export interface Meta {
  language?: string;
}

export interface Resume {
  meta?: Meta;
  basics: Basics;
  work?: Work[];
  volunteer?: Volunteer[];
  education?: Education[];
  awards?: Award[];
  skills?: Skill[];
  projects?: Project[];
  interests?: Interest[];
  languages?: Language[];
  references?: Reference[];
}

export interface Template {
  name: string;
  description: string;
  render: (resume: Resume) => string;
}
