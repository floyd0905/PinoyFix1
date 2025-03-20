using System.ComponentModel.DataAnnotations;

namespace RegistrationApplication.Models
{
    public class RegistrationModel
    {
        // First Name - Required
        [Required(ErrorMessage = "First Name is required.")]
        public string FirstName { get; set; }

        // Middle Name (Optional)
        public string MiddleName { get; set; }

        // Last Name - Required
        [Required(ErrorMessage = "Last Name is required.")]
        public string LastName { get; set; }

        // Address - Required
        [Required(ErrorMessage = "Address is required.")]
        public string Address { get; set; }

        // Phone Number - Required, must be 11 digits
        [Required(ErrorMessage = "Phone Number is required.")]
        [RegularExpression(@"^\d{11}$", ErrorMessage = "Phone number must be 11 digits.")]
        public string PhoneNumber { get; set; }

        // Email - Required, must be in a valid email format
        [Required(ErrorMessage = "Email is required.")]
        [EmailAddress(ErrorMessage = "Invalid email format.")]
        public string Email { get; set; }

        // Password - Required, length between 8 and 20 characters
        [Required(ErrorMessage = "Password is required.")]
        [StringLength(20, MinimumLength = 8, ErrorMessage = "Password must be between 8 and 20 characters.")]
        public string Password { get; set; }
    }
}
