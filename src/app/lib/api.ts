const BASE = process.env.NEXT_PUBLIC_API_BASE!;

export async function startCase() {
  const r = await fetch(`${BASE}/start_case`, { method:'POST' });
  if (!r.ok) throw new Error('start_case failed');
  console.log(r)
  return r.json();
}

export async function actOnce(body:{sessionId:string; action:string; question?:string; scene?:string; suspectId?:string;}) {
  const r = await fetch(`${BASE}/act`, {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error('act failed');
  return r.json();
}