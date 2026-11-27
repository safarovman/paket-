export interface AuctionPerson { public_id: number | null; name: string; }
export interface AuctionItem {
  id: string;
  status: "live" | "ended" | "cancelled";
  start_price: number;
  min_step: number;
  current_bid: number | null;
  bids_count: number;
  ends_at: string;
  created_at: string;
  min_next: number;
  leader: AuctionPerson | null;
  winner: AuctionPerson | null;
  is_mine_leading: boolean | null;
  is_mine_won: boolean | null;
  account: {
    id: string; public_no: number | null; title: string; game: string; rank: string | null; level: number | null;
    description: string | null; image_url: string | null; images: string[] | null; price: number;
  };
}
export interface AuctionBid { amount: number; created_at: string; bidder_public_id: number | null; bidder_name: string; is_mine: boolean; }
