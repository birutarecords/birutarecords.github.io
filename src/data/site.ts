// Configuração geral: edita src/data/site.json (ou "Definições" no Pages CMS).
// Mailchimp: Audience → Signup forms → Embedded forms → copia o "action" do <form>
// e o nome do campo honeypot (b_xxxxxxxx_yyyyyyyy). Ativa o double opt-in na Audience.
import data from './site.json';
export const site = data;
