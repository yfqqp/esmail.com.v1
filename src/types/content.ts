// Strict content payload types for each block — used in forms + validation

export type AnyContent =
  | import('./index').HeroContent
  | import('./index').TimelineContent
  | import('./index').AcademicContent
  | import('./index').ProjectsSectionContent
  | import('./index').JournalContent
  | import('./index').InterestsContent
  | import('./index').VisionContent
  | import('./index').QuotesSectionContent
  | import('./index').GalleryContent
  | import('./index').AIAssistantContent

export type ContentForType<T extends import('./database').SectionType> =
  T extends 'hero'         ? import('./index').HeroContent :
  T extends 'timeline'     ? import('./index').TimelineContent :
  T extends 'academic'     ? import('./index').AcademicContent :
  T extends 'projects'     ? import('./index').ProjectsSectionContent :
  T extends 'journal'      ? import('./index').JournalContent :
  T extends 'interests'    ? import('./index').InterestsContent :
  T extends 'vision'       ? import('./index').VisionContent :
  T extends 'quotes'       ? import('./index').QuotesSectionContent :
  T extends 'gallery'      ? import('./index').GalleryContent :
  T extends 'ai_assistant' ? import('./index').AIAssistantContent :
  Record<string, unknown>
