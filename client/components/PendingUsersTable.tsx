import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

interface PendingUser {
  _id: string;
  email: string;
  username: string;
  role: string;
  status: string;
  createdAt: string;
}

export default function PendingUsersTable() {
  const { toast } = useToast();
  const [loading, setLoading] = useState<boolean>(false);
  const [items, setItems] = useState<PendingUser[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchPending = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/pending-users", { method: "GET" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch pending users");
      }
      setItems(data.data || []);
    } catch (e: any) {
      setError(e.message || "Failed to fetch pending users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/approve/${id}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Approval failed");
      setItems((list) => list.filter((i) => i._id !== id));
      toast({ title: "User approved", description: "The user has been created." });
    } catch (e: any) {
      toast({ title: "Approval failed", description: e.message, });
    }
  };

  const handleReject = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/reject/${id}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Rejection failed");
      setItems((list) => list.filter((i) => i._id !== id));
      toast({ title: "Request rejected", description: "The request has been removed." });
    } catch (e: any) {
      toast({ title: "Rejection failed", description: e.message, });
    }
  };

  return (
    <Card className="mt-6 w-full">
      <CardContent className="p-6">
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : error ? (
          <div className="text-sm text-destructive">{error}</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-muted-foreground">No pending requests.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((u) => (
                <TableRow key={u._id}>
                  <TableCell>{u.username}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell className="capitalize">{u.role}</TableCell>
                  <TableCell className="capitalize">{u.status}</TableCell>
                  <TableCell>{new Date(u.createdAt).toLocaleString()}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" onClick={() => handleApprove(u._id)}>Approve</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleReject(u._id)}>Reject</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
