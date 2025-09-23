const DEFAULT_USERNAME = (
  process.env.NEXT_PUBLIC_INSTAGRAM_USERNAME ?? "altessaluxe"
)
  .replace(/^@/, "")
  .trim();

function getInstagramUsername(): string {
  return DEFAULT_USERNAME;
}

export function buildInstagramProfileLink(): string {
  return `https://www.instagram.com/${getInstagramUsername()}/`;
}

export function buildInstagramDmLink(): string {
  return `https://ig.me/m/${getInstagramUsername()}`;
}
