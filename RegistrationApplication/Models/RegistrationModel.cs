using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace RegistrationApplication.Models
{
    public class RegistrationModel
    {
        public string firstName { get; set; }
        public string lastName { get; set; }
        public string Address { get; set; }
        public int PhoneNumber { get; set; }
    }
}