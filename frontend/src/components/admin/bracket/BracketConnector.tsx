function BracketConnector({ slotCount }: { slotCount: number }) {
  const pairs = Math.max(Math.ceil(slotCount / 2), 1);

  return (
    <div className="bracket-connector-col" aria-hidden>
      {Array.from({ length: pairs }).map((_, i) => (
        <div key={i} className="bracket-connector-slot">
          <div className="bracket-connector-h" />
          <div className="bracket-connector-v" />
          <div className="bracket-connector-bracket" />
        </div>
      ))}
    </div>
  );
}

export { BracketConnector };
