import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AutocompleteSearch from "./AutocompleteSearch";
import { Search, Calendar, GraduationCap, GitBranch } from "lucide-react";

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
    <div className="rounded-lg border border-border/40 bg-card shadow-sm p-4">
      <div className="grid gap-4 md:grid-cols-5 items-end">
        {/* Search field - spans 2 columns */}
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="search" className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <Search className="w-3 h-3" />
            Search
          </Label>
          <AutocompleteSearch
            value={filters.searchTerm}
            onChange={(value) => onFilterChange({ ...filters, searchTerm: value })}
            onSelect={(suggestion) => onFilterChange({ ...filters, searchTerm: suggestion.name })}
            branch={filters.branch}
          />
        </div>

        {/* Batch filter */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <Calendar className="w-3 h-3" />
            Batch
          </Label>
          <Select
            value={filters.batch ?? "any"}
            onValueChange={(v) => onFilterChange({ ...filters, batch: v === "any" ? undefined : v })}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="2015">2015</SelectItem>
              <SelectItem value="2016">2016</SelectItem>
              <SelectItem value="2017">2017</SelectItem>
              <SelectItem value="2018">2018</SelectItem>
              <SelectItem value="2019">2019</SelectItem>
              <SelectItem value="2020">2020</SelectItem>
              <SelectItem value="2021">2021</SelectItem>
              <SelectItem value="2022">2022</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Degree filter */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <GraduationCap className="w-3 h-3" />
            Degree
          </Label>
          <Select
            value={filters.degree ?? "any"}
            onValueChange={(v) => onFilterChange({ ...filters, degree: v === "any" ? undefined : v })}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="B.Tech">B.Tech</SelectItem>
              <SelectItem value="M.Tech">M.Tech</SelectItem>
              <SelectItem value="PhD">PhD</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Branch filter */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <GitBranch className="w-3 h-3" />
            Branch
          </Label>
          <Select
            value={filters.branch ?? "any"}
            onValueChange={(v) => onFilterChange({ ...filters, branch: v === "any" ? undefined : v })}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="CSE">CSE</SelectItem>
              <SelectItem value="ECE">ECE</SelectItem>
              <SelectItem value="DS">Data Science</SelectItem>
              <SelectItem value="DSAI">DS & AI</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
