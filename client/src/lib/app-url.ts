export const getAppUrl = (path = '/') => new URL(path, window.location.origin).toString();
