const API_URL = "https://script.google.com/macros/s/AKfycbzMCVIVfT1kLLQhRDeZwOENFAPW-GGdut_HA2e-g-wXXzh2N4RNtaEL_PDGk6k5fbv4/exec";

export const fetchData = async (action: string, email?: string) => {
  const url = email
    ? `${API_URL}&action=${action}&email=${encodeURIComponent(email)}`
    : `${API_URL}&action=${action}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};

export const postData = async (action: string, body: Record<string, unknown>) => {
  const res = await fetch(`${API_URL}&action=${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to submit");
  return res.json();
};
