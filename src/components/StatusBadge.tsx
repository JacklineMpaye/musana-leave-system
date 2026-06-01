const StatusBadge = ({ status }: { status: string }) => {
  const s = status?.toLowerCase();
  let classes = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ";
  if (s?.includes("approved")) classes += "bg-success/15 text-success";
  else if (s?.includes("pending")) classes += "bg-warning/15 text-warning";
  else if (s?.includes("rejected")) classes += "bg-destructive/15 text-destructive";
  else classes += "bg-muted text-muted-foreground";

  return <span className={classes}>{status || "-"}</span>;
};

export default StatusBadge;
