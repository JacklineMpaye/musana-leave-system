const API_URL = "https://script.google.com/macros/s/AKfycbzMCVIVfT1kLLQhRDeZwOENFAPW-GGdut_HA2e-g-wXXzh2N4RNtaEL_PDGk6k5fbv4/exec";

export const fetchData = async (action: string, email?: string) => {
  const url = email
    ? `${API_URL}?action=${action}&email=${encodeURIComponent(email)}`
    : `${API_URL}?action=${action}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(url, {
      signal:   controller.signal,
      redirect: "follow",
      mode:     "cors",
    });
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  } finally {
    clearTimeout(timeout);
  }
};

export const postData = async (action: string, body: Record<string, unknown>) => {
  const res = await fetch(`${API_URL}?action=${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to submit");
  return res.json();
};

// Returns JSON — uses the new deptApproval endpoint (not the HTML-based email link handler)
export const approveRejectDept = async (requestId: string, action: "approve" | "reject", reason?: string) => {
  let url = `${API_URL}?action=deptApproval&req=${encodeURIComponent(requestId)}&decision=${action}`;
  if (reason) url += `&reason=${encodeURIComponent(reason)}`;
  const res = await fetch(url, { redirect: "follow", mode: "cors" });
  if (!res.ok) throw new Error("Failed to submit");
  const data = await res.json();
  if (!data.success) throw new Error(data.error || "Action failed");
  return data;
};

// Returns JSON — uses the new hrApproval endpoint (not the HTML-based email link handler)
export const approveRejectHR = async (requestId: string, action: "approve" | "reject", reason?: string) => {
  let url = `${API_URL}?action=hrApproval&req=${encodeURIComponent(requestId)}&decision=${action}`;
  if (reason) url += `&reason=${encodeURIComponent(reason)}`;
  const res = await fetch(url, { redirect: "follow", mode: "cors" });
  if (!res.ok) throw new Error("Failed to submit");
  const data = await res.json();
  if (!data.success) throw new Error(data.error || "Action failed");
  return data;
};
