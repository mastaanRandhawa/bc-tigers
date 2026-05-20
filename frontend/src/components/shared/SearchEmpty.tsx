interface SearchEmptyProps {
  query: string;
  entityLabel?: string;
}

export default function SearchEmpty({ query, entityLabel = 'results' }: SearchEmptyProps) {
  return (
    <p className="py-8 text-center text-sm text-zinc-500">
      No {entityLabel} match &ldquo;{query}&rdquo;.
    </p>
  );
}
