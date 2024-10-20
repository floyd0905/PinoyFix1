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

        public ActionResult LoginPage()
        {
            return View();
        }

        public ActionResult Dashboard()
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