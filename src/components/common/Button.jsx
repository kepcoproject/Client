import "./Button.css";

export default function Button({ variant = "primary", loading, icon: Icon, children, disabled, ...rest }) {
  return (
    <button className={`btn btn-${variant}`} disabled={disabled || loading} {...rest}>
      {loading ? (
        <span className="spinner" style={{ width: 16, height: 16 }} />
      ) : (
        <>
          {Icon && <Icon size={16} strokeWidth={2.2} />}
          {children}
        </>
      )}
    </button>
  );
}
