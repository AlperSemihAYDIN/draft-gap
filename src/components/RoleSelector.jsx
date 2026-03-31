// Rol Seçici bileşeni — Top, Jungle, Mid, ADC, Support

const ROLES = [
  { id: 'top', label: 'Top', icon: '🛡️' },
  { id: 'jungle', label: 'Jungle', icon: '🌿' },
  { id: 'mid', label: 'Mid', icon: '⚡' },
  { id: 'adc', label: 'ADC', icon: '🏹' },
  { id: 'support', label: 'Support', icon: '💚' },
];

export default function RoleSelector({ selectedRole, onSelect }) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {ROLES.map((role) => (
        <button
          key={role.id}
          onClick={() => onSelect(role.id)}
          className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-all
            text-sm sm:text-base
            ${
              selectedRole === role.id
                ? 'bg-lol-blue text-lol-dark shadow-lg shadow-lol-blue/30 scale-105'
                : 'bg-lol-gray/80 text-lol-light hover:bg-lol-gray hover:text-white border border-lol-light/10'
            }`}
        >
          <span className="text-lg">{role.icon}</span>
          <span>{role.label}</span>
        </button>
      ))}
    </div>
  );
}
