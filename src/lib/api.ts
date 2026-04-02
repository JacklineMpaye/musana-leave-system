const API_URL = "https://script.googleusercontent.com/a/macros/musana.org/echo?user_content_key=AWDtjMW-bMc_cnEHwHcdvEwAJIwh1kWqIpuATziuaFbTYP7mGeMvUlxEk2NAeUa1xnHf_VLgOMBX4VMKPAG56A5gzntLrR8-x_fpOt-btUhQmME4qCyOUdnvYChywxV7z9yOBe9W95cNcCut1NG17OxlI8krfjAokpV0EpE-ablHlqGijJO1afnRT8NP68aECloGMdymPZB58WqYBxR-1cdHf-EICoBtMp1VK4wVhthiBZwK2OdHN4YQKHa9WgXVggt0K243UJMjyjGtH2P0dBDa3gvaCubpOxuswFJQxevUYbxP6JhDqRbzyGzsakr1NqqgK5Ez1a1w&lib=M4EE4T2ANSJcEFgHrCPc03k0LTOfyky5F";

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
