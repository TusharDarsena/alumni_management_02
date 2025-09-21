import type { AlumniItem } from "@/components/AlumniCard";

export const slugify = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

export const alumniList: AlumniItem[] = [
  { name: "John Doe", degree: "B.Tech", branch: "CSE", batch: "2020", company: "Google", username: slugify("John Doe"), avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&auto=format&fit=crop&q=60" },
  { name: "Merna Collins", degree: "B.Tech", branch: "ECE", batch: "2019", company: "Amazon", username: slugify("Merna Collins"), avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=256&auto=format&fit=crop&q=60" },
  { name: "Aarav Gupta", degree: "M.Tech", branch: "CSE", batch: "2022", company: "Microsoft", username: slugify("Aarav Gupta"), avatarUrl: "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=256&auto=format&fit=crop&q=60" },
  { name: "Sara Lee", degree: "PhD", branch: "DS", batch: "2021", company: "NVIDIA", username: slugify("Sara Lee"), avatarUrl: "https://images.unsplash.com/photo-1541534401786-2077eed87a72?w=256&auto=format&fit=crop&q=60" },
  { name: "Rohan Verma", degree: "B.Tech", branch: "CSE", batch: "2023", company: "Swiggy", username: slugify("Rohan Verma"), avatarUrl: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=256&auto=format&fit=crop&q=60" },
  { name: "Emily Chen", degree: "M.Tech", branch: "ECE", batch: "2020", company: "Meta", username: slugify("Emily Chen"), avatarUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=256&auto=format&fit=crop&q=60" },
  { name: "Mohit Sharma", degree: "B.Tech", branch: "DS", batch: "2019", company: "Adobe", username: slugify("Mohit Sharma"), avatarUrl: "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=256&auto=format&fit=crop&q=60" },
  { name: "Priya Singh", degree: "PhD", branch: "CSE", batch: "2018", company: "Intel", username: slugify("Priya Singh"), avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=256&auto=format&fit=crop&q=60" },
];
