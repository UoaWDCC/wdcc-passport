import { CreateBadgeButton } from "@/components/admin/CreateBadgeButton";

export default function Admin() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl leading-none font-semibold md:text-4xl">Admin</h1>
        <p className="mt-2 text-base leading-7 text-gray-600">Create and manage badges.</p>
      </header>

      <CreateBadgeButton />
    </div>
  );
}
