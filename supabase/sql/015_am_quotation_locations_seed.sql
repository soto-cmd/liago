-- Valores de ciudades/lugares históricos de A&M: solo lectura del origen.
-- Idempotente: no cambia las cotizaciones anteriores.
insert into public.quotation_locations (organization_id,name)
values ('7369c304-d00d-4a13-bf59-3c9bb201bfef','Santa María de Fe'),
('7369c304-d00d-4a13-bf59-3c9bb201bfef','San Ignacio'),
('7369c304-d00d-4a13-bf59-3c9bb201bfef','Salon Municipal'),
('7369c304-d00d-4a13-bf59-3c9bb201bfef','Cerro Costa'),
('7369c304-d00d-4a13-bf59-3c9bb201bfef','Particular'),
('7369c304-d00d-4a13-bf59-3c9bb201bfef','San Juan Bautista'),
('7369c304-d00d-4a13-bf59-3c9bb201bfef','Predio del Polideportivo'),
('7369c304-d00d-4a13-bf59-3c9bb201bfef','San Fernando')
on conflict (organization_id, (lower(trim(name)))) do nothing;