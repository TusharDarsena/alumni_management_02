import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AutocompleteSearch from "./AutocompleteSearch";

export interface AlumniFilters {
  searchTerm: string;
  batch?: string;
  degree?: string;
  branch?: string;
}

interface AlumniFilterBarProps {
  filters: AlumniFilters;
  onFilterChange: (filters: AlumniFilters) => void;
}

export default function AlumniFilterBar({ filters, onFilterChange }: AlumniFilterBarProps) {
  return (
    <div className="rounded-lg border bg-white p-4 grid gap-4 md:grid-cols-4">
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="search">Search</Label>
        <AutocompleteSearch
          value={filters.searchTerm}
          onChange={(value) => onFilterChange({ ...filters, searchTerm: value })}
          onSelect={(suggestion) => onFilterChange({ ...filters, searchTerm: suggestion.name })}
          branch={filters.branch}
        />
      </div>
      <div className="space-y-2">
        <Label>Batch</Label>
        <Select value={filters.batch ?? "any"} onValueChange={(v) => onFilterChange({ ...filters, batch: v === "any" ? undefined : v })}>
          <SelectTrigger>
            <SelectValue placeholder="Select batch" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any</SelectItem>
            <SelectItem value="2019">2019</SelectItem>
            <SelectItem value="2020">2020</SelectItem>
            <SelectItem value="2021">2021</SelectItem>
            <SelectItem value="2022">2022</SelectItem>
            <SelectItem value="2023">2023</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Degree</Label>
        <Select value={filters.degree ?? "any"} onValueChange={(v) => onFilterChange({ ...filters, degree: v === "any" ? undefined : v })}>
          <SelectTrigger>
            <SelectValue placeholder="Select degree" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any</SelectItem>
            <SelectItem value="B.Tech">B.Tech</SelectItem>
            <SelectItem value="M.Tech">M.Tech</SelectItem>
            <SelectItem value="PhD">PhD</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2 md:col-span-1">
        <Label>Branch</Label>
        <Select value={filters.branch ?? "any"} onValueChange={(v) => onFilterChange({ ...filters, branch: v === "any" ? undefined : v })}>
          <SelectTrigger>
            <SelectValue placeholder="Select branch" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any</SelectItem>
            <SelectItem value="CSE">CSE</SelectItem>
            <SelectItem value="ECE">ECE</SelectItem>
            <SelectItem value="DS">Data Science</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
