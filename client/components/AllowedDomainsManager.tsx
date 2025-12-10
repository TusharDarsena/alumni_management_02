import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuthToken } from "@/hooks/useClerkAuth";
import { Plus, Trash2, Globe } from "lucide-react";

interface AllowedDomain {
  _id: string;
  domain: string;
  description: string;
  createdAt: string;
}

export default function AllowedDomainsManager() {
  const { toast } = useToast();
  const { getAuthHeaders } = useAuthToken();
  const [loading, setLoading] = useState<boolean>(false);
  const [domains, setDomains] = useState<AllowedDomain[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [newDomain, setNewDomain] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [adding, setAdding] = useState(false);

  const fetchDomains = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/admin/allowed-domains", { 
        method: "GET",
        headers,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch domains");
      }
      setDomains(data.data || []);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Failed to fetch domains";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDomains();
  }, []);

  const handleAddDomain = async () => {
    if (!newDomain.trim()) {
      toast({ title: "Error", description: "Domain is required", variant: "destructive" });
      return;
    }

    setAdding(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/admin/allowed-domains", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          domain: newDomain.trim(),
          description: newDescription.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to add domain");
      }
      setDomains((prev) => [...prev, data.data]);
      setNewDomain("");
      setNewDescription("");
      toast({ title: "Success", description: `Domain ${newDomain} added successfully` });
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Failed to add domain";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveDomain = async (id: string, domain: string) => {
    if (!confirm(`Are you sure you want to remove ${domain}?`)) return;

    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/admin/allowed-domains/${id}`, {
        method: "DELETE",
        headers,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to remove domain");
      }
      setDomains((prev) => prev.filter((d) => d._id !== id));
      toast({ title: "Success", description: `Domain ${domain} removed` });
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Failed to remove domain";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Allowed Email Domains
        </CardTitle>
        <CardDescription>
          Only users with emails from these domains can sign up. Add domains to allow more organizations.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new domain form */}
        <div className="flex gap-2">
          <Input
            placeholder="example.edu"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            className="flex-1"
          />
          <Input
            placeholder="Description (optional)"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleAddDomain} disabled={adding}>
            <Plus className="h-4 w-4 mr-1" />
            {adding ? "Adding..." : "Add Domain"}
          </Button>
        </div>

        {/* Domains list */}
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : error ? (
          <div className="text-sm text-destructive">{error}</div>
        ) : domains.length === 0 ? (
          <div className="text-sm text-muted-foreground">No domains configured. Add at least one domain to allow signups.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Domain</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {domains.map((d) => (
                <TableRow key={d._id}>
                  <TableCell className="font-mono">@{d.domain}</TableCell>
                  <TableCell>{d.description || "-"}</TableCell>
                  <TableCell>{new Date(d.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => handleRemoveDomain(d._id, d.domain)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
