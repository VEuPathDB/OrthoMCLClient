import * as Decode from 'wdk-client/Utils/Json';

export interface TaxonEntry {
  abbrev: string;
  children: Record<string, TaxonEntry>;
  commonName: string;
  id: number;
  name: string;
  sortIndex: number;
  species: boolean;
}

export type TaxonEntries = Record<string, TaxonEntry>;

export const taxonEntryDecoder: Decode.Decoder<TaxonEntry> = Decode.combine(
  Decode.field('abbrev', Decode.string),
  Decode.field('children', Decode.lazy(() => Decode.objectOf(taxonEntryDecoder))),
  Decode.field('commonName', Decode.string),
  Decode.field('id', Decode.number),
  Decode.field('name', Decode.string),
  Decode.field('sortIndex', Decode.number),
  Decode.field('species', Decode.boolean)
);

export const taxonEntriesDecoder: Decode.Decoder<TaxonEntries> = Decode.objectOf(taxonEntryDecoder);
