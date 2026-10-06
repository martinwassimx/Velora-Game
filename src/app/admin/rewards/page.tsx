import { Icon } from "@/components/icons";
import { AddRewardForm, RewardVisibilityForm } from "@/components/reward-forms";
import { Alert, PageHeader } from "@/components/ui";
import { deleteRedeemReward } from "@/lib/actions/rewards";
import { requireAdmin } from "@/lib/auth";
import { formatNumber } from "@/lib/format";
import { publicRewardImage } from "@/lib/media";
import { getRewardShop } from "@/lib/rewards";

export default async function AdminRewardsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const params = await searchParams;
  await requireAdmin();
  const shop = await getRewardShop();

  return (
    <div className="space-y-4">
      <PageHeader
        title="Coin rewards"
        subtitle="Add what players can redeem. While Coming soon is on, their page stays closed."
      />
      {params.ok === "deleted" ? <Alert tone="ok">The reward was deleted.</Alert> : null}
      {params.error ? <Alert tone="error">{params.error}</Alert> : null}
      <RewardVisibilityForm comingSoon={shop.comingSoon} />
      <AddRewardForm />
      <div className="grid gap-3">
        {shop.rewards.map((item) => {
          const image = publicRewardImage(item.image_path);
          return (
          <article key={item.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-3">
              {image ? <img src={image} alt="" className="h-20 w-20 rounded-2xl object-cover" /> : null}
              <div>
              <h2 className="font-extrabold">{item.title}</h2>
              {item.description ? <p className="text-sm leading-7 text-[#a1a1aa]">{item.description}</p> : null}
              <p className="flex items-center gap-1.5 text-sm font-semibold text-[#e4e4e7]"><Icon name="coin" /> {formatNumber(item.coins)} coins</p>
              </div>
            </div>
            <form action={deleteRedeemReward}>
              <input type="hidden" name="id" value={item.id} />
              <button className="btn btn-danger">Delete</button>
            </form>
          </article>
          );
        })}
      </div>
    </div>
  );
}
