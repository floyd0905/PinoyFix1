using Microsoft.Ajax.Utilities;
using RegistrationApplication.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace RegistrationApplication.Controllers
{
    public class HomeController : Controller
    {
        public ActionResult Index()
        {
            return View();
        }

        public ActionResult About()
        {
            ViewBag.Message = "Your application description page.";

            return View();
        }

        public ActionResult Contact()
        {
            ViewBag.Message = "Your contact page.";

            return View();
        }

        public ActionResult RegistrationPage()
        {
            return View();
        }

        // Handle registration (POST)
        [HttpPost]
        public JsonResult PostData(RegistrationModel registrationInfo)
        {
            // Check if the model is valid before processing the registration data
            if (ModelState.IsValid)
            {
                // Add the new user to the in-memory list
                registeredUsers.Add(registrationInfo);

                // Example of returning a success message (you can replace this with actual data processing)
                return Json(new { success = true, message = "Registration successful!" }, JsonRequestBehavior.AllowGet);
            }

            // If the model is not valid, return validation error messages
            var errorMessages = ModelState.Values.SelectMany(v => v.Errors)
                                                  .Select(e => e.ErrorMessage)
                                                  .ToList();

            return Json(new { success = false, errors = errorMessages }, JsonRequestBehavior.AllowGet);
        }

        private static List<RegistrationModel> registeredUsers = new List<RegistrationModel>();
        public JsonResult GetRegisteredUsers()
        {
            return Json(new { success = true, users = registeredUsers }, JsonRequestBehavior.AllowGet);
        }
    

        public ActionResult LoginPage()
        {
            return View();
        }

        public ActionResult Dashboard()
        {
            return View();

        }
        public ActionResult HomePage()
        {
            return View();

        }
        public ActionResult ProfilePage()
        {
            return View();

        }
        public ActionResult RegistrationPage2()
        {
            return View();

        }
        public ActionResult MOP()
        {
            return View();

        }
        public ActionResult DefaultPage()
        {
            return View();

        }
    }

}










/*--------------------- LESSON CODES ----------------------------*/
/*-
         public string GetUserAlert()
        {
            return "Connected Successfully";
        }

        public string GetUserAccess(int UAccess, string UName)
        {
            if (UAccess.Equals(1))
            {
                if (UName.Equals("Amadi"))
                {
                    return "Welcome admin Sydney";
                }

                else
                {
                    return "Welcome admin";
                }
            }
            else
            {
                return "User is not an admin";
            }
        }

        public int GetUserRank(int UserID)
        {
            return 100;
        }

        public JsonResult PostData(RegistrationModel registrationInfo)
        {
            var firstName = registrationInfo.firstName ;
            var lastName = registrationInfo.lastName;
            var address = registrationInfo.Address;
            var pnumber = registrationInfo.PhoneNumber;

            var regInfo = new RegistrationModel()
            {
                firstName = firstName,
                lastName = lastName,
                Address = address,
                PhoneNumber = pnumber
            };



            return Json(firstName, JsonRequestBehavior.AllowGet);
        }

 */