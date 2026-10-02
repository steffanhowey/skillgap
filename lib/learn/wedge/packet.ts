import { hashCanonicalJson } from "@/lib/ai/hash";
import { WEDGE_APPLICATION_STABLE_KEY } from "./application";
import packetJson from "./packets/2026-08-28.json";
import type { EditorialSourcePacket } from "./types";

const RAW_PACKET = packetJson as Omit<EditorialSourcePacket, "packet_hash">;

/**
 * Load the dated editorial packet and attach a content hash.
 * This is not a live market-demand signal.
 */
export function loadEditorialSourcePacket(
  now: Date = new Date(),
): EditorialSourcePacket {
  if (RAW_PACKET.application_stable_key !== WEDGE_APPLICATION_STABLE_KEY) {
    throw new Error("Editorial packet does not match the seeded application.");
  }
  if (RAW_PACKET.why_now_label !== "editorial_next_step") {
    throw new Error("Editorial packet must use why_now_label editorial_next_step.");
  }
  if (new Date(RAW_PACKET.expires_at).getTime() <= now.getTime()) {
    throw new Error("Editorial packet has expired.");
  }

  return {
    ...RAW_PACKET,
    packet_hash: hashCanonicalJson(RAW_PACKET),
  };
}

/**
 * Return the packet hash without a freshness check (for resume / replay).
 */
export function hashEditorialSourcePacket(
  packet: Omit<EditorialSourcePacket, "packet_hash"> | EditorialSourcePacket,
): string {
  const { packet_hash: _ignored, ...rest } = packet as EditorialSourcePacket;
  return hashCanonicalJson(rest);
}
