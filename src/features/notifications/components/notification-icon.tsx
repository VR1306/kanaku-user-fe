import { Icon } from "@/components/icons/icon";
import { NOTIFICATION_STYLE, type NotificationKind } from "@/constants/notifications";
import { TONE_TINT } from "@/features/dashboard/tones";
import { cn } from "@/utils/cn";

/** Rounded tile with the kind's icon and colour. */
export function NotificationIcon({
  kind,
  size = "md",
}: {
  kind: NotificationKind;
  size?: "sm" | "md";
}) {
  const style = NOTIFICATION_STYLE[kind];
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid shrink-0 place-items-center",
        size === "md" ? "size-[46px] rounded-[14px]" : "size-10 rounded-[12px]",
        TONE_TINT[style.tone],
      )}
    >
      <Icon name={style.icon} size={size === "md" ? 20 : 18} strokeWidth={2} />
    </span>
  );
}
