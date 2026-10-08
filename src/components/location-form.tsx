import { LocateButton } from "@/components/locate-button";
import { RADII } from "@/lib/params";

type Props = {
  action: string;
  values?: Record<string, string>;
  children?: React.ReactNode;
  submitLabel?: string;
  showLocate?: boolean;
};

// A plain GET form: works without JavaScript and produces a shareable URL.
export function LocationForm({ action, values = {}, children, submitLabel = "Search", showLocate = true }: Props) {
  // No default ZIP: an empty form searches Datamart's default area, which the results flag.
  const zip = values.zip ?? "";
  const radius = values.radius_miles ?? "20";
  return (
    <form className="panel form" action={action} method="get" role="search">
      <label className="field">
        ZIP code
        <input name="zip" inputMode="numeric" autoComplete="postal-code" pattern="[0-9]{5}" maxLength={5} defaultValue={zip} placeholder="95032" />
      </label>
      <label className="field">
        or city
        <input name="city" autoComplete="address-level2" defaultValue={values.city ?? ""} placeholder="Los Gatos" />
      </label>
      <label className="field">
        State
        <input name="state" autoComplete="address-level1" maxLength={2} defaultValue={values.state ?? ""} placeholder="CA" />
      </label>
      <label className="field">
        Within
        <select name="radius_miles" defaultValue={RADII.includes(radius) ? radius : "20"}>
          {RADII.map(r => (
            <option key={r} value={r}>{r} miles</option>
          ))}
        </select>
      </label>
      {children}
      <div className="actions wide">
        <button type="submit" className="btn">{submitLabel}</button>
        {showLocate && <LocateButton action={action} radius={radius} />}
      </div>
    </form>
  );
}
