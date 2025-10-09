import React, {
  useState,
  useCallback,
  useEffect,
  ChangeEvent,
  InputHTMLAttributes,
} from "react";

interface CnpjInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  name: string;
  onChange?: (event: { target: { name: string; value: string } }) => void;
  className?: string;
}

const formatarCNPJ = (value: string): string => {
  const cleanValue = value.replace(/\D/g, "").substring(0, 14);
  let formatted = cleanValue;
  if (cleanValue.length > 2) formatted = formatted.replace(/^(\d{2})/, "$1.");
  if (cleanValue.length > 5)
    formatted = formatted.replace(/^(\d{2})\.(\d{3})/, "$1.$2.");
  if (cleanValue.length > 8)
    formatted = formatted.replace(/^(\d{2})\.(\d{3})\.(\d{3})/, "$1.$2.$3/");
  if (cleanValue.length > 12)
    formatted = formatted.replace(
      /^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})/,
      "$1.$2.$3/$4-"
    );
  return formatted;
};

const CnpjInput: React.FC<CnpjInputProps> = ({
  label,
  name,
  id,
  onChange,
  className = "",
  value,
  ...rest
}) => {
  const [cnpjFormatado, setCnpjFormatado] = useState(
    formatarCNPJ(value?.toString() || "")
  );

  useEffect(() => {
    if (value !== undefined && value !== null) {
      setCnpjFormatado(formatarCNPJ(value.toString()));
    }
  }, [value]);

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const formatted = formatarCNPJ(event.target.value);
      setCnpjFormatado(formatted);

      if (onChange) {
        const valorLimpo = formatted.replace(/\D/g, "");
        onChange({
          target: { name, value: valorLimpo },
        });
      }
    },
    [name, onChange]
  );

  return (
    <div className="mb-4">
      <label
        htmlFor={id || name}
        className="block text-sm font-medium mb-1 text-[#E0E0E0]"
      >
        {label || "CNPJ"}
      </label>
      <input
        name={name}
        id={id || name}
        type="text"
        value={cnpjFormatado}
        onChange={handleChange}
        maxLength={18}
        className={`w-full px-4 py-2 bg-[#0D1117] text-[#E0E0E0] outline-none rounded-xl focus:ring-2 focus:ring-[#2196F3] ${className}`}
        {...rest}
      />
    </div>
  );
};

export default CnpjInput;
