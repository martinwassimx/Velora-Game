import { Icon } from "@/components/icons";
import { EmptyState, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { formatNumber } from "@/lib/format";
import { publicRewardImage } from "@/lib/media";
import { getRewardShop } from "@/lib/rewards";

export default async function RewardsPage() {
  const { profile } = await requireUser();
  const shop = await getRewardShop();

  return (
    <div>
      <PageHeader title="Redeem coins" subtitle={`You have ${formatNumber(profile.coins)} coins.`} />
      {shop.comingSoon ? (
        <section className="card px-5 py-12 text-center">
          <Icon name="gift" className="mx-auto h-8 w-8" />
          <h2 className="mt-3 text-2xl font-black">Coming soon</h2>
          <p className="mx-auto mt-2 max-w-md leading-7 text-[#a1a1aa]">
            The rewards you can redeem with coins are still being prepared. Redemption is closed for now.
          </p>
          <button type="button" className="btn btn-primary btn-soon mt-5" disabled>
            Coming soon
          </button>
        </section>
      ) : shop.rewards.length === 0 ? (
        <EmptyState title="No rewards yet" body="When rewards are added, you'll see what you can claim with your coins." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {shop.rewards.map((item) => {
            const affordable = profile.coins >= item.coins;
            const missing = item.coins - profile.coins;
            const image = publicRewardImage(item.image_path);
            return (
              <article key={item.id} className="card p-4">
                {image ? <img src={image} alt="" className="mb-3 h-44 w-full rounded-2xl object-cover" /> : null}
                <h2 className="text-lg font-extrabold">{item.title}</h2>
                {item.description ? <p className="mt-1 text-sm leading-7 text-[#a1a1aa]">{item.description}</p> : null}
                <p className="mt-3 flex items-center gap-1.5 font-semibold text-[#e4e4e7]"><Icon name="coin" /> {formatNumber(item.coins)} coins</p>
                <p className={`mt-1 text-sm font-bold ${affordable ? "text-[#e4e4e7]" : "text-[#a1a1aa]"}`}>
                  {affordable ? "You have enough coins for this reward" : `You need ${formatNumber(missing)} more coins`}
                </p>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
