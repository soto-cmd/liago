import { createOrganizationAction } from "@/app/onboarding/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function OrganizationForm() {
  return (
    <form action={createOrganizationAction} className="grid gap-4 md:grid-cols-2">
      <div className="md:col-span-2">
        <label className="mb-1.5 block text-sm font-medium">Nombre comercial *</label>
        <Input name="name" required />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Razón social</label>
        <Input name="legalName" />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">RUC / documento</label>
        <Input name="taxId" />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Teléfono</label>
        <Input name="phone" />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">WhatsApp</label>
        <Input name="whatsapp" />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Email</label>
        <Input name="email" type="email" />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Ciudad</label>
        <Input name="city" />
      </div>
      <div className="md:col-span-2">
        <label className="mb-1.5 block text-sm font-medium">Dirección</label>
        <Input name="address" />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">País</label>
        <Input name="country" defaultValue="PY" maxLength={2} />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Moneda</label>
        <Input name="currency" defaultValue="PYG" maxLength={3} />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Color principal</label>
        <Input name="primaryColor" type="color" defaultValue="#171717" className="p-1" />
      </div>

      <div className="md:col-span-2 pt-2">
        <Button type="submit">Crear empresa</Button>
      </div>
    </form>
  );
}
