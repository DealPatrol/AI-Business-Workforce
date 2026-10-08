export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class ProspectorSetupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProspectorSetupError';
  }
}

export class PublicFetchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PublicFetchError';
  }
}

export class PlacesError extends Error {
  status: number;

  constructor(message: string, status = 502) {
    super(message);
    this.name = 'PlacesError';
    this.status = status;
  }
}
