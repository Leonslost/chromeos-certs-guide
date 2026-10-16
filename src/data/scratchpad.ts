/**
 * Scratchpad variables (planning doc section 6).
 * Values are collected once, at the step that needs them, and fill every snippet.
 * NEVER add a field for a secret (challenge value, key contents).
 */
import type { PathId } from './flow';

export interface Field {
  key: string;
  label: string;
  hint: string;
  example: string;
  /** Step where the value is collected (for display). */
  collectedAt: string;
  /** PATHs for which the field is relevant. */
  paths: PathId[];
  optional?: boolean;
  /** URL-like value: the inline input spans the full width of its group. */
  wide?: boolean;
}

const ALL: PathId[] = ['SCEP', 'DIY', 'VENDOR'];

export const FIELDS: Field[] = [
  {
    key: 'project_id',
    label: 'Project ID',
    hint: 'The project ID, which Google may add random characters to. Copy it from the console.',
    example: 'my-chromeos-certs',
    collectedAt: 'Step 3',
    paths: ALL,
  },
  {
    key: 'topic_id',
    label: 'Topic ID',
    hint: 'Short name of the topic, not the full path.',
    example: 'cert-provisioning',
    collectedAt: 'Step 3',
    paths: ALL,
  },
  {
    key: 'subscription_id',
    label: 'Subscription ID',
    hint: 'Short name of the subscription. Leave empty to use <topic ID>-sub, the name the console gives its default subscription.',
    example: 'cert-provisioning-sub',
    collectedAt: 'Step 3',
    paths: ALL,
  },
  {
    key: 'connector_sa_name',
    label: 'Connector service account name',
    hint: 'The part before the @. The email is derived below.',
    example: 'cert-connector',
    collectedAt: 'Step 3',
    paths: ALL,
  },
  {
    key: 'scep_url',
    label: 'SCEP URL',
    hint: 'The SCEP server endpoint the GCCC box can reach.',
    example: 'https://scep.example.com/scep',
    collectedAt: 'Step 2',
    paths: ['SCEP'],
    wide: true,
  },
  {
    key: 'ca_template',
    label: 'CA template name',
    hint: 'Only if your CA uses certificate templates (for example AD CS). Used in the Admin console profile in Step 4.',
    example: 'ChromeOSClientAuth',
    collectedAt: 'Step 2',
    paths: ['SCEP'],
    optional: true,
  },
  {
    key: 'ca_connection_id',
    label: 'CA connection configuration identifier',
    hint: 'The identifier you set in the Admin console CA connection.',
    example: 'my-scep-connection',
    collectedAt: 'Step 4',
    paths: ['SCEP', 'DIY'],
  },
  {
    key: 'profile_name',
    label: 'Certificate provisioning profile name',
    hint: 'Optional. Only used in troubleshooting snippets.',
    example: 'pilot-device-profile',
    collectedAt: 'Step 4',
    paths: ['SCEP', 'DIY'],
    optional: true,
  },
];

/** Values computed from other values. Templates can use `{{connector_sa_email}}`. */
export const DERIVED: Record<string, { label: string; template: string }> = {
  connector_sa_email: {
    label: 'Connector service account email (derived)',
    template: '{{connector_sa_name}}@{{project_id}}.iam.gserviceaccount.com',
  },
};

/**
 * Fields that fall back to a template while the user has not set them. The default is never written
 * into state: it keeps following the other values until the user types an explicit override.
 */
export const DEFAULTS: Record<string, string> = {
  subscription_id: '{{topic_id}}-sub',
};

export function fieldsForPath(path: PathId | undefined): Field[] {
  return path ? FIELDS.filter((f) => f.paths.includes(path)) : [];
}
