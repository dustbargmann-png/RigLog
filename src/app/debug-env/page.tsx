function findBadChars(value: string | undefined) {
  if (!value) return { present: false, length: 0, badChars: [] as { index: number; code: number }[] };
  const badChars: { index: number; code: number }[] = [];
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code > 255) badChars.push({ index: i, code });
  }
  return { present: true, length: value.length, badChars };
}

export default function DebugEnvPage() {
  const url = findBadChars(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = findBadChars(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  return (
    <pre style={{ padding: 16, fontSize: 14 }}>
      {JSON.stringify({ url, key }, null, 2)}
    </pre>
  );
}
