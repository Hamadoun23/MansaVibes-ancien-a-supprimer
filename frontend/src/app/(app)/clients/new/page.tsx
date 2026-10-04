"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shell/PageHeader";
import { ClientForm } from "../ClientForm";

export default function NewClientPage() {
  const router = useRouter();

  return (
    <div>
      <PageHeader back title="Nouveau client" />
      <div className="mx-auto max-w-lg px-4 md:px-8">
        <ClientForm
          client={null}
          onCancel={() => router.push("/clients")}
          onSaved={(client) => router.push(`/clients/${client.id}`)}
        />
      </div>
    </div>
  );
}
