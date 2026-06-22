export enum PermissionModule {
  VOCABULARY = 'VOCABULARY',
  QUOTE = 'QUOTE',
  USER = 'USER',
}

export enum PermissionAction {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

export enum TagType {
  VOCAB = 'VOCAB',
  QUOTE = 'QUOTE',
}

export enum ProgressStatus {
  LEARNING = 'LEARNING',
  MASTERED = 'MASTERED',
}

export enum ActiveType {
  LOGIN = 'LOGIN',
  LEARN_FLASHCARD = 'LEARN_FLASHCARD',
  READ_QUOTE = 'READ_QUOTE',
}

export enum TargetType {
  VOCABULARY = 'VOCABULARY',
  QUOTE = 'QUOTE',
  TAG = 'TAG',
  NONE = 'NONE',
}
