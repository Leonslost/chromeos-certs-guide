/**
 * Troubleshooting trees: one data structure per symptom card, rendered as the card's checks on /troubleshooting/.
 * Source: the author's GCCC test bench (reproduced failure modes).
 * Cards themselves (title, paths, officialLinks) live in src/content/troubleshooting/*.md;
 * trees are keyed by the card's collection id.
 */
export interface Question {
  kind: 'question';
  id: string;
  question: string;
  /** Inline-markdown help text, one paragraph per entry. */
  help: string[];
  /** Snippet ids (src/snippets/index.json). */
  snippets?: string[];
  yesLabel?: string;
  noLabel?: string;
  yes: string;
  no: string;
}

export interface Verdict {
  kind: 'verdict';
  id: string;
  title: string;
  text: string[];
  fix?: { text: string };
  snippets?: string[];
}

export type TreeNode = Question | Verdict;

export interface Tree {
  root: string;
  nodes: Record<string, TreeNode>;
}

const n = (...nodes: TreeNode[]): Record<string, TreeNode> => Object.fromEntries(nodes.map((x) => [x.id, x]));

export const trees: Record<string, Tree> = {
  't3-device-waiting-gccc-silent': {
    root: 'service',
    nodes: n(
      {
        kind: 'question',
        id: 'service',
        question: 'Is the GCCC service running, on the subscription you expect?',
        help: [
          'Healthy: the service shows `Running`, and the log shows `Listening to requests...` on the expected subscription.',
          'In the `Parsed configurations` line, note `request_subscriptions` and `ca_connection_config_id`. The latter must match the Admin console CA connection\'s **CA connection configuration identifier** exactly.',
        ],
        snippets: ['ts-service-check'],
        yesLabel: 'Yes',
        noLabel: 'No',
        yes: 'dials',
        no: 'v-config',
      },
      {
        kind: 'verdict',
        id: 'v-config',
        title: 'Fix the service or its config first',
        text: [
          'Start the service, or correct `request_subscriptions` / `ca_connection_config_id` in `adapter_config.json`, restart it, and test again.',
          'If the log shows Errors instead, you are in a different symptom ("Device waiting, GCCC logs Errors").',
        ],
      },
      {
        kind: 'question',
        id: 'dials',
        question: 'Are the dial lines repeating?',
        help: [
          'Count the `ProxyContextDialer called` lines per hour (needs debug logging). About **2 per hour** is healthy while idle.',
          'About **100–220 per hour with no Error** is the silent reconnect loop: TCP connects, then TLS or HTTP/2 fails.',
        ],
        snippets: ['ts-dial-counter', 'ts-dial-count-hour'],
        yesLabel: 'Yes, 100+ per hour',
        noLabel: 'No, about 2 per hour',
        yes: 'tls',
        no: 'topic',
      },
      // ---- network branch ----
      {
        kind: 'question',
        id: 'tls',
        question: 'Does the TLS check show Google Trust Services as the issuer?',
        help: [
          'Run it on the connector host, not from a workstation. If `curl.exe` already shows `CRYPT_E_NO_REVOCATION_CHECK`, start here.',
          '`TcpTestSucceeded: True` for the hostnames proves **TCP only, not TLS**. Customers who say "the hostnames are open" usually pass it.',
        ],
        snippets: ['ts-tcp-hostnames', 'ts-tls-issuer'],
        yesLabel: 'Yes, issuer is Google Trust Services',
        noLabel: 'No: other issuer, hang, reset or exception',
        yes: 'v-no-inspection',
        no: 'v-inspection',
      },
      {
        kind: 'verdict',
        id: 'v-inspection',
        title: 'TLS inspection, or a firewall killing TLS, is in the path',
        text: [
          '**Any other issuer** (a firewall or corporate CA) means TLS inspection is in the path. It reproduced the silent loop on the bench.',
          '**A hang, reset or exception** means a firewall kills the TLS session after TCP connects. This is silent in GCCC and was reproduced.',
          '`curl.exe`: `CRYPT_E_NO_REVOCATION_CHECK`, then `http=404` with `--ssl-revoke-best-effort`, points to a trusted inspection CA with no revocation info. `SEC_E_UNTRUSTED_ROOT` is an inspection CA this server does not trust. Either way GCCC loops silently.',
        ],
        fix: {
          text: 'Ask the network team to exempt `*.googleapis.com` from TLS inspection for the GCCC server, or to pass HTTP/2 through. Restart GCCC and send the probe again: a `received message` line confirms the fix. Only the faults were reproduced, not either fix on a real appliance.',
        },
      },
      {
        kind: 'verdict',
        id: 'v-no-inspection',
        title: 'No inspection by issuer: look elsewhere',
        text: [
          'Run the curl check. `http=404` is normal for `/`. `CRYPT_E_REVOCATION_OFFLINE` means Google\'s CRL/OCSP hosts are blocked, but **GCCC is unaffected**: it is a red herring.',
          'With PowerShell 7, check HTTP/2. `ALPN=http/1.1` with a non-Google issuer breaks GCCC silently, because gRPC needs HTTP/2. Windows PowerShell 5.1 and inbox curl cannot negotiate ALPN.',
          'Read the `Proxy info:` line GCCC prints at start. If the dial lines say `Dialed proxy server` rather than `No proxy found`, a proxy that answers `200` and then goes quiet gives the same loop.',
        ],
        snippets: ['ts-curl-check', 'ts-http2-check'],
      },
      // ---- wiring branch ----
      {
        kind: 'question',
        id: 'topic',
        question: 'Trigger an enrolment (or send the probe). Does the topic\'s `send_request_count` move?',
        help: [
          'Cloud console → the topic → Metrics, or Metrics Explorer `pubsub.googleapis.com/topic/send_request_count`. Metrics lag 1–3 minutes.',
          'For the probe, use `gcloud` (see probe). Do **not** use the GCP console\'s "Publish message": it cannot send the probe\'s binary payload.',
        ],
        yesLabel: 'Yes, it moves',
        noLabel: 'No, it does not',
        yes: 'pulls',
        no: 'v-no-publish',
      },
      {
        kind: 'verdict',
        id: 'v-no-publish',
        title: 'Google did not publish to this topic. GCCC is innocent.',
        text: [
          'The CA connection in the Admin console points at a different topic or project, or the device or profile never fired.',
          'Check the CA connection\'s Pub/Sub topic against your scratchpad, then check the device has the policy (`chrome://policy` → `RequiredClientCertificateForDevice` / `…ForUser`).',
        ],
      },
      {
        kind: 'question',
        id: 'pulls',
        question: 'Is `open_streaming_pulls` on the intended subscription 0 (or no data)?',
        help: [
          'Metrics Explorer `pubsub.googleapis.com/subscription/open_streaming_pulls`. **10 per GCCC is healthy.**',
        ],
        yesLabel: 'Yes, 0 or no data',
        noLabel: 'No, about 10',
        yes: 'v-not-attached',
        no: 'consumer',
      },
      {
        kind: 'verdict',
        id: 'v-not-attached',
        title: 'GCCC is not attached to that subscription',
        text: [
          'It is stopped, `adapter_config.json` names a different subscription, or it cannot connect (the last one logs Errors). The subscription\'s `num_undelivered_messages` and `oldest_unacked_message_age` **grow**.',
          '`0` while GCCC says Listening means GCCC\'s stream never reaches Google: go back to the dial-line and TLS checks.',
        ],
      },
      {
        kind: 'question',
        id: 'consumer',
        question: 'Do the subscription\'s `sent_message_count` and `ack_message_count` rise while GCCC logs no `received message`?',
        help: [
          'Metrics Explorer `pubsub.googleapis.com/subscription/sent_message_count` and `…/ack_message_count`.',
        ],
        yesLabel: 'Yes, they rise',
        noLabel: 'No, both stay at 0',
        yes: 'v-other-consumer',
        no: 'v-filter-topic',
      },
      {
        kind: 'verdict',
        id: 'v-other-consumer',
        title: 'Another consumer is taking the messages',
        text: [
          'A second GCCC (a forgotten one shows as **+10 streams**), a test connector, or a script. Find it and stop it.',
        ],
      },
      {
        kind: 'verdict',
        id: 'v-filter-topic',
        title: 'The subscription never received them: a filter, or the wrong topic',
        text: [
          'A **filter** (`ack_message_count{delivery_type=filter}` above 0 is the smoking gun) or the subscription is on a **different topic**.',
          'A healthy subscription prints **only** the `topic:` line. If a `filter:` line appears, or `topic` is wrong, everything is dropped silently.',
        ],
        snippets: ['ts-sub-describe'],
      },
    ),
  },
};

// ---- helpers shared by both views ---------------------------------------

/** Depth-first order, so "Check N" numbering is identical in both views. */
export function flatten(tree: Tree): TreeNode[] {
  const out: TreeNode[] = [];
  const seen = new Set<string>();
  const visit = (id: string) => {
    if (seen.has(id)) return;
    seen.add(id);
    const node = tree.nodes[id];
    if (!node) throw new Error(`Troubleshooting tree: unknown node "${id}"`);
    out.push(node);
    if (node.kind === 'question') {
      visit(node.yes);
      visit(node.no);
    }
  };
  visit(tree.root);
  return out;
}

export function numbering(tree: Tree): Record<string, string> {
  const labels: Record<string, string> = {};
  let q = 0;
  let v = 0;
  for (const node of flatten(tree)) labels[node.id] = node.kind === 'question' ? `Check ${++q}` : `Result ${String.fromCharCode(64 + ++v)}`;
  return labels;
}
