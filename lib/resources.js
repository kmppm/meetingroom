// Daftar resource yang bisa di-booking (ruangan / meja).
// Booking lama yang belum punya field "resource" otomatis dianggap DEFAULT_RESOURCE.
//
// maxPeople hanya INFO yang ditampilkan di label dropdown, BUKAN batas keras:
// Sadiman tetap bisa dipilih walau peserta lebih dari 4 (mis. meeting yang sifatnya rahasia).
export const RESOURCES = {
  sadiman: {
    code: "sadiman",
    name: "Ruangan Meeting Sadiman",
    maxPeople: 4,
  },
  heksagon: {
    code: "heksagon",
    name: "Meja Meeting Heksagon",
    maxPeople: null,
  },
};

export const DEFAULT_RESOURCE = "sadiman";

export function isValidResource(code) {
  return Boolean(code) && Object.prototype.hasOwnProperty.call(RESOURCES, code);
}

export function getResourceMeta(code) {
  return RESOURCES[code] || RESOURCES[DEFAULT_RESOURCE];
}