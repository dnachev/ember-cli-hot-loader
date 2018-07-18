import { get } from '@ember/object';
import { getOwner } from '@ember/application';

/**
 * Unsee a requirejs module if it exists
 * @param {String} module The requirejs module name
 */
function requireUnsee(module) {
  if (window.requirejs.has(module)) {
      window.requirejs.unsee(module);
  }
}

/**
 * Clears the requirejs cache for a component, checking for both "classic"
 * style components & "pod" style components
 *
 * @param {Object} config The applicaiton config
 * @param {String} componentName The component name being reloaded
 */
export function clearRequirejsCache(config, parsedName) {
  // Invalidate regular module
  requireUnsee(`${parsedName.prefix}/components/${parsedName.fullNameWithoutType}`);
  requireUnsee(`${parsedName.prefix}/templates/components/${parsedName.fullNameWithoutType}`);

  // Invalidate pod modules
  requireUnsee(`${parsedName.prefix}/components/${parsedName.fullNameWithoutType}/component`);
  requireUnsee(`${parsedName.prefix}/components/${parsedName.fullNameWithoutType}/template`);
}

/**
 * Clears the requirejs cache for a component, checking for both "classic"
 * style components & "pod" style components
 *
 * @param {Object} component The component that's being reloaded
 * @param {String} componentName The component name being reloaded
 */
export default function (component, componentName) {
  const owner = getOwner(component);
  const config = owner.resolveRegistration('config:environment');
  clearRequirejsCache(config, componentName);
}
