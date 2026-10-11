/** Section ids from the YardProof homepage before it moved to /postcards. */
export const LEGACY_HOME_ANCHORS = ['how', 'demo10', 'package'] as const;

export type LegacyHomeAnchor = (typeof LEGACY_HOME_ANCHORS)[number];

/**
 * Hash fragments never reach the server. On `/`, send the old anchor to
 * `/{id}`, which next.config permanently redirects (308) to `/postcards#{id}`.
 */
export function legacyHomeAnchorScript() {
  const allowed = JSON.stringify(LEGACY_HOME_ANCHORS);
  return `(function(){if(location.pathname!=="/"&&location.pathname!=="")return;var allowed=${allowed};var id=(location.hash||"").replace(/^#/,"");if(allowed.indexOf(id)!==-1)location.replace("/"+id);})();`;
}
