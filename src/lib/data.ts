import { getCollection, getEntries, type CollectionEntry } from 'astro:content';

export type Release = CollectionEntry<'releases'>;
export type Artist = CollectionEntry<'artists'>;
export type Event = CollectionEntry<'events'>;

export async function getReleases() {
  const all = await getCollection('releases', ({ data }) => !data.draft);
  return all.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export async function getArtists() {
  const all = await getCollection('artists');
  return all.sort((a, b) => a.data.name.localeCompare(b.data.name, 'pt'));
}

/** Concertos: próximos (de hoje em diante, ordem crescente) e passados (mais recentes primeiro).
 *  "Hoje" é calculado no momento do build — o workflow faz rebuild diário. */
export async function getEvents() {
  const all = await getCollection('events', ({ data }) => !data.draft);
  const today = new Date(new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Lisbon' }));
  const upcoming = all.filter((e) => e.data.date >= today).sort((a, b) => a.data.date.valueOf() - b.data.date.valueOf());
  const past = all.filter((e) => e.data.date < today).sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
  return { upcoming, past };
}

export const resolveArtists = (refs: { collection: 'artists'; id: string }[]) => getEntries(refs);

const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('pt-PT', { timeZone: 'UTC', ...opts });
export const formatDate = (d: Date) => fmt({ day: 'numeric', month: 'long', year: 'numeric' }).format(d);
export const formatShort = (d: Date) => fmt({ day: '2-digit', month: 'short' }).format(d).replace('.', '');
export const year = (d: Date) => d.getUTCFullYear();

export function groupByYear<T extends { data: { date: Date } }>(items: T[]) {
  const map = new Map<number, T[]>();
  for (const it of items) {
    const y = year(it.data.date);
    map.set(y, [...(map.get(y) ?? []), it]);
  }
  return [...map.entries()];
}
