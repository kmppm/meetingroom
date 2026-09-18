// Static metadata for the 4 requesting units + the admin role.
// Colors are used for avatars and for coloring booking blocks on the schedule grid.

export const UNITS = {
  KI: {
    code: "KI",
    name: "Knowledge and Innovation",
    initials: "KI",
    color: "#10B981", // emerald
  },
  SG: {
    code: "SG",
    name: "Strategy and Growth",
    initials: "SG",
    color: "#F97316", // orange
  },
  RQ: {
    code: "RQ",
    name: "Risk and Quality",
    initials: "RQ",
    color: "#3B82F6", // blue
  },
  LSP: {
    code: "LSP",
    name: "Lembaga Sertifikasi Profesi",
    initials: "LSP",
    color: "#EAB308", // amber
  },
};

export const ADMIN_META = {
  code: "ADMIN",
  name: "Admin",
  initials: "AD",
  color: "#3A3A3A",
};

export function getUnitMeta(code) {
  if (code === "ADMIN") return ADMIN_META;
  return UNITS[code] || null;
}

export function listUnitCodes() {
  return Object.keys(UNITS);
}