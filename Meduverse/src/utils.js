export const createPageUrl = (pageName) => {
  // Convert camelCase or PascalCase to hyphen-separated, then lowercase.
  // Examples: "DoctorAgent" -> "doctor-agent", "Home Page" -> "home-page"
  const withHyphens = pageName
    // insert hyphen between lower-to-upper case boundaries
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    // replace spaces or underscores with hyphens
    .replace(/[_\s]+/g, '-')
    ;
  return `/${withHyphens.toLowerCase()}`;
};