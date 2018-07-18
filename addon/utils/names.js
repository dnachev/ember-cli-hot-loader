export default function fullNameWithoutType(parsedName) {
  return parsedName.fullName.replace(/^[^:]+:/, '');
}
