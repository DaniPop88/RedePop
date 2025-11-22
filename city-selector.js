document.addEventListener('DOMContentLoaded', function() {
  const stateSelect = document.getElementById('state');
  const cityContainer = document.getElementById('cityContainer');
  
  stateSelect.addEventListener('change', function() {
    const selectedState = this.value;
    
    // Clear the current city input/select but keep the form-field wrapper
    const existingInput = cityContainer.querySelector('input, select');
    const existingLabel = cityContainer.querySelector('label');
    const existingIcon = cityContainer.querySelector('.success-icon');
    const existingSmall = cityContainer.querySelector('small');
    
    if (existingInput) existingInput.remove();
    if (existingLabel) existingLabel.remove();
    if (existingIcon) existingIcon.remove();
    
    if (selectedState && citiesByState[selectedState]) {
      // Create a select element for cities
      const citySelect = document.createElement('select');
      citySelect.setAttribute('id', 'city');
      citySelect.setAttribute('name', 'city');
      citySelect.setAttribute('required', 'required');
      
      // Add default option
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.text = '';
      defaultOption.disabled = true;
      defaultOption.selected = true;
      citySelect.appendChild(defaultOption);
      
      // Add cities for the selected state
      citiesByState[selectedState].forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        option.text = city;
        citySelect.appendChild(option);
      });
      
      // Add the select to the container (before small tag)
      cityContainer.insertBefore(citySelect, existingSmall);
      
      // Create label
      const label = document.createElement('label');
      label.setAttribute('for', 'city');
      label.textContent = 'CIDADE';
      cityContainer.insertBefore(label, existingSmall);
      
      // Create success icon
      const icon = document.createElement('span');
      icon.className = 'success-icon';
      icon.textContent = '✓';
      cityContainer.insertBefore(icon, existingSmall);
      
      // Update small text
      if (existingSmall) {
        existingSmall.textContent = `Escolha a cidade de ${selectedState}`;
      }
      
    } else {
      // If no state is selected or no cities data, show text input
      const cityInput = document.createElement('input');
      cityInput.setAttribute('type', 'text');
      cityInput.setAttribute('id', 'city');
      cityInput.setAttribute('name', 'city');
      cityInput.setAttribute('required', 'required');
      cityInput.setAttribute('placeholder', ' ');
      cityContainer.insertBefore(cityInput, existingSmall);
      
      // Create label
      const label = document.createElement('label');
      label.setAttribute('for', 'city');
      label.textContent = 'CIDADE';
      cityContainer.insertBefore(label, existingSmall);
      
      // Create success icon
      const icon = document.createElement('span');
      icon.className = 'success-icon';
      icon.textContent = '✓';
      cityContainer.insertBefore(icon, existingSmall);
      
      // Update small text
      if (existingSmall) {
        existingSmall.textContent = 'Escolha seu estado primeiro';
      }
    }
    
    // Re-initialize floating labels for the new field
    const newField = cityContainer.querySelector('input, select');
    if (newField) {
      newField.addEventListener('input', function() {
        if (this.value) {
          cityContainer.classList.add('has-value');
        } else {
          cityContainer.classList.remove('has-value');
        }
      });
      
      newField.addEventListener('change', function() {
        if (this.value) {
          cityContainer.classList.add('has-value');
        } else {
          cityContainer.classList.remove('has-value');
        }
      });
    }
  });
});